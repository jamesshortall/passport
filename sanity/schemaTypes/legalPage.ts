import { defineType, defineField } from "sanity";

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal / Content Page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Which page",
      type: "string",
      description: "Must match the route.",
      options: {
        list: [
          { title: "Privacy Policy (/privacy)", value: "privacy" },
          { title: "Terms of Service (/terms)", value: "terms" },
          { title: "Cookie Policy (/cookies)", value: "cookies" },
          { title: "Content Accuracy Disclaimer (/disclaimer)", value: "disclaimer" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Body (Markdown)",
      type: "text",
      rows: 30,
      description: "Written in Markdown — headings (#), lists (-), links, bold, etc.",
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug" },
  },
});
