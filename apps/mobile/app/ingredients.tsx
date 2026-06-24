import { ScrollView, Text, View } from "react-native";

const INGREDIENTS = [
  {
    name: "Niacinamide",
    tag: "Brightening · Barrier",
    blurb:
      "A form of vitamin B3 that calms redness, supports the barrier, and visibly evens tone over 8–12 weeks at 2–5%.",
    grade: "A",
  },
  {
    name: "Vitamin C (L-Ascorbic Acid)",
    tag: "Antioxidant · Brightening",
    blurb:
      "Neutralizes daytime free radicals and fades hyperpigmentation. Best at 10–20% with a low pH.",
    grade: "A",
  },
  {
    name: "Retinol",
    tag: "Renewal · Anti-aging",
    blurb:
      "The most studied anti-aging ingredient. Speeds turnover, improves fine lines and texture.",
    grade: "A",
  },
  {
    name: "Salicylic Acid",
    tag: "Acne · Pores",
    blurb:
      "Oil-soluble BHA that clears congestion inside pores. Excellent for combination and oily skin.",
    grade: "A",
  },
  {
    name: "Centella Asiatica",
    tag: "Calming · Sensitive",
    blurb:
      "A botanical with real clinical data for reducing redness and supporting wound healing.",
    grade: "B",
  },
  {
    name: "Hyaluronic Acid",
    tag: "Hydration",
    blurb:
      "A humectant that holds water in the upper skin layers. Layer onto damp skin and seal.",
    grade: "B",
  },
];

export default function Ingredients() {
  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="px-6 py-8"
    >
      <Text className="text-xs text-muted">Library / Ingredients</Text>
      <Text className="mt-1 text-3xl font-semibold text-ink">
        The ingredients library
      </Text>
      <Text className="mt-2 text-sm leading-6 text-muted">
        What&apos;s actually in your skincare — explained in plain English, graded by the
        weight of real research.
      </Text>

      <View className="mt-6 gap-4">
        {INGREDIENTS.map((i) => (
          <View
            key={i.name}
            className="rounded-2xl border border-soft-tan bg-warm-white p-5"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-semibold text-ink">{i.name}</Text>
                <Text className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-clay">
                  {i.tag}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-xl border border-soft-tan bg-cream">
                <Text className="text-base font-semibold text-ink">{i.grade}</Text>
              </View>
            </View>
            <Text className="mt-3 text-sm leading-5 text-muted">{i.blurb}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
