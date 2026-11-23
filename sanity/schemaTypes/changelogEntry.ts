import { defineType, defineField } from "sanity";

export const changelogEntry = defineType({
  name: "changelogEntry",
  title: "What's New entry",
  type: "document",
  fields: [
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      options: { list: ["New", "Improved", "Fixed", "Launch"] },
      initialValue: "New",
      validation: (r) => r.required(),
    }),
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.required().min(1),
    }),
  ],
  orderings: [
    { title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "date", tag: "tag" },
    prepare: ({ title, subtitle, tag }) => ({ title, subtitle: `${tag} · ${subtitle}` }),
  },
});
