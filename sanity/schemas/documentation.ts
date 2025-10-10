/**
 * Documentation Schema
 *
 * Schema definition for documentation pages
 */

export default {
  name: 'documentation',
  title: 'Documentation',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Getting Started', value: 'getting-started' },
          { title: 'API Reference', value: 'api-reference' },
          { title: 'Guides', value: 'guides' },
          { title: 'Examples', value: 'examples' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Order in navigation (lower numbers appear first)',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'code',
          title: 'Code Block',
        },
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
    },
    {
      name: 'relatedDocs',
      title: 'Related Documentation',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'documentation' }] }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
    },
    prepare(selection: any) {
      const { title, category } = selection;
      return {
        title,
        subtitle: category,
      };
    },
  },
};
