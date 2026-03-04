export type HaikuNode = {
  id: number
  title: string
  slug: string
  description: string
}

export const haikuNodes: HaikuNode[] = [
  {
    id: 1,
    title: "Listen",
    slug: "listen",
    description:
      "Everything begins with a pause. Before designing, we listen.",
  },
  {
    id: 2,
    title: "Analyze",
    slug: "analyze",
    description:
      "We observe patterns, contexts and connections with intention.",
  },
  {
    id: 3,
    title: "Synthesize",
    slug: "synthesize",
    description:
      "Clarity emerges when complexity is distilled into essence.",
  },
  {
    id: 4,
    title: "Design",
    slug: "design",
    description:
      "Ideas become form. Design translates insight into experience.",
  },
  {
    id: 5,
    title: "Communicate",
    slug: "communicate",
    description:
      "Communication is dialogue. We propose rather than impose.",
  },
  {
    id: 6,
    title: "Conceptualize / Transform",
    slug: "transform",
    description:
      "Design reveals transformation — what changed, not only what was made.",
  },
]