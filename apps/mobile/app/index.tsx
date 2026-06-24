import { ScrollView, Text, View, Pressable } from "react-native";
import { Link } from "expo-router";

const STATS = [
  { n: "240k+", l: "skin profiles matched" },
  { n: "31k+", l: "products decoded" },
  { n: "12k+", l: "research sources" },
];

export default function Home() {
  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="px-6 py-10"
    >
      <View className="self-start rounded-full border border-soft-tan bg-warm-white px-4 py-2">
        <Text className="text-xs font-medium text-muted">
          Personalized by AI · Backed by real science
        </Text>
      </View>

      <Text className="mt-6 text-4xl font-semibold leading-tight text-ink">
        Your skin, finally explained.
      </Text>
      <Text className="mt-4 text-base leading-6 text-muted">
        Answer a few questions about your skin. We&apos;ll match you with products
        backed by real research — and tell you exactly why each one is right for you.
      </Text>

      <Link href="/ingredients" asChild>
        <Pressable className="mt-8 rounded-2xl bg-primary px-6 py-4 active:opacity-90">
          <Text className="text-center text-base font-bold text-warm-white">
            Explore ingredients →
          </Text>
        </Pressable>
      </Link>

      <View className="mt-10 flex-row flex-wrap gap-x-8 gap-y-4 border-t border-soft-tan pt-8">
        {STATS.map((s) => (
          <View key={s.n}>
            <Text className="text-2xl font-semibold text-ink">{s.n}</Text>
            <Text className="mt-0.5 text-xs text-muted">{s.l}</Text>
          </View>
        ))}
      </View>

      <View className="mt-10 rounded-2xl border border-soft-tan bg-warm-white p-6">
        <Text className="text-xs font-semibold uppercase tracking-widest text-clay">
          COSRX
        </Text>
        <Text className="mt-1 text-lg font-semibold text-ink">
          Advanced Snail 96 Mucin Essence
        </Text>
        <View className="mt-4 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Text className="text-base font-bold text-warm-white">94%</Text>
          </View>
          <Text className="text-sm text-muted">Great match · Dry · Sensitive</Text>
        </View>
      </View>
    </ScrollView>
  );
}
