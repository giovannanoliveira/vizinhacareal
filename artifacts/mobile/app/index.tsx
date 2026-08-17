import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { IMOVEIS, Imovel, fuzzySearch, getMediaGeral } from '@/data/mock';
import { useReviews } from '@/contexts/ReviewContext';
import { SearchCard } from '@/components/SearchCard';

const RECENTS_KEY = '@vizinhanca_recents';
const MAX_RECENTS = 5;

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userReviews } = useReviews();
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY).then((val) => {
      if (val) setRecentIds(JSON.parse(val) as string[]);
    });
  }, []);

  const saveRecent = useCallback(
    async (id: string) => {
      const updated = [id, ...recentIds.filter((r) => r !== id)].slice(0, MAX_RECENTS);
      setRecentIds(updated);
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    },
    [recentIds],
  );

  const getExtraReviews = useCallback(
    (imovelId: string) => userReviews.filter((r) => r.imovelId === imovelId),
    [userReviews],
  );

  const filteredResults = useMemo<Imovel[]>(() => {
    if (!query.trim()) return IMOVEIS;
    return fuzzySearch(query, IMOVEIS);
  }, [query]);

  const showFuzzy = query.trim().length > 0 && filteredResults.length === 0;
  const topFuzzy = useMemo(() => {
    if (!showFuzzy) return [];
    return fuzzySearch(query, IMOVEIS).slice(0, 3);
  }, [showFuzzy, query]);

  const recentImoveis = useMemo(
    () => recentIds.map((id) => IMOVEIS.find((i) => i.id === id)).filter(Boolean) as Imovel[],
    [recentIds],
  );

  const handleSelect = (imovel: Imovel) => {
    saveRecent(imovel.id);
    router.push(`/imovel/${imovel.id}`);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: topPad + 24 }]}>
      {/* Wordmark */}
      <Text style={[styles.wordmark, { color: colors.primary }]}>Vizinhança Real</Text>
      <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
        Descubra como é realmente morar ali antes de assinar.
      </Text>

      {/* Search Input */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.card,
            borderColor: query ? colors.secondary : colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={18} color={colors.secondary} />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
          placeholder="Buscar endereço ou condomínio"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Section title */}
      {!query && recentImoveis.length > 0 && (
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Buscas recentes
        </Text>
      )}
      {!query && recentImoveis.length === 0 && (
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Todos os imóveis
        </Text>
      )}
      {query.length > 0 && filteredResults.length > 0 && (
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {filteredResults.length} {filteredResults.length === 1 ? 'resultado' : 'resultados'}
        </Text>
      )}

      {/* Fuzzy empty state */}
      {showFuzzy && (
        <View style={styles.fuzzyState}>
          <Text style={[styles.fuzzyTitle, { color: colors.foreground }]}>
            Nenhum resultado exato
          </Text>
          <Text style={[styles.fuzzySubtitle, { color: colors.mutedForeground }]}>
            Você quis dizer um desses?
          </Text>
          {topFuzzy.map((imovel) => (
            <Pressable
              key={imovel.id}
              onPress={() => handleSelect(imovel)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <SearchCard imovel={imovel} extraReviews={getExtraReviews(imovel.id)} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const data = query ? filteredResults : recentImoveis.length > 0 ? recentImoveis : IMOVEIS;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={showFuzzy ? [] : data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.cardWrapper, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => handleSelect(item)}
          >
            <SearchCard imovel={item} extraReviews={getExtraReviews(item.id)} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: 20,
    gap: 8,
  },
  cardWrapper: {},
  fuzzyState: {
    gap: 10,
    marginTop: 8,
  },
  fuzzyTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  fuzzySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
});
