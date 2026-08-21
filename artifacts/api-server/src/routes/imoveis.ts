import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import {
  db,
  avaliacoesTable,
  imoveisTable,
  usuariosTable,
  type Imovel,
} from "@workspace/db";
import {
  GetImovelParams,
  GetImovelResponse,
  ListImoveisResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type AvaliacaoRow = {
  avaliacao: typeof avaliacoesTable.$inferSelect;
  userName: string;
};

function serializeAvaliacao(row: AvaliacaoRow) {
  const { avaliacao, userName } = row;
  return {
    id: avaliacao.id,
    imovelId: avaliacao.imovelId,
    userId: avaliacao.userId,
    userName,
    data: avaliacao.createdAt,
    notas: avaliacao.notas,
    oQueGostariaDeSaber: avaliacao.oQueGostariaDeSaber,
  };
}

async function loadAvaliacoes(imovelId?: number): Promise<AvaliacaoRow[]> {
  const base = db
    .select({ avaliacao: avaliacoesTable, userName: usuariosTable.name })
    .from(avaliacoesTable)
    .innerJoin(usuariosTable, eq(avaliacoesTable.userId, usuariosTable.id))
    .orderBy(desc(avaliacoesTable.createdAt));
  if (imovelId !== undefined) {
    return base.where(eq(avaliacoesTable.imovelId, imovelId));
  }
  return base;
}

function serializeImovel(imovel: Imovel, avaliacoes: AvaliacaoRow[]) {
  return {
    id: imovel.id,
    nome: imovel.nome,
    endereco: imovel.endereco,
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    avaliacoes: avaliacoes
      .filter((r) => r.avaliacao.imovelId === imovel.id)
      .map(serializeAvaliacao),
  };
}

router.get("/imoveis", async (_req, res): Promise<void> => {
  const [imoveis, avaliacoes] = await Promise.all([
    db.select().from(imoveisTable).orderBy(asc(imoveisTable.id)),
    loadAvaliacoes(),
  ]);
  res.json(
    ListImoveisResponse.parse(
      imoveis.map((i) => serializeImovel(i, avaliacoes)),
    ),
  );
});

router.get("/imoveis/:id", async (req, res): Promise<void> => {
  const params = GetImovelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [imovel] = await db
    .select()
    .from(imoveisTable)
    .where(eq(imoveisTable.id, params.data.id));
  if (!imovel) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }
  const avaliacoes = await loadAvaliacoes(imovel.id);
  res.json(GetImovelResponse.parse(serializeImovel(imovel, avaliacoes)));
});

export { serializeAvaliacao, loadAvaliacoes };
export default router;
