export type Template = {
  id: string;
  title: string;
  body: string;
  category: string; // free text, e.g. "Email", "Vendor Follow-up", "Meeting Recap"
  archived: boolean;
};

export type TemplatesData = {
  templates: Template[];
};

export function emptyTemplatesData(): TemplatesData {
  return { templates: [] };
}

export function normalizeTemplatesData(
  partial: Partial<TemplatesData> | null | undefined
): TemplatesData {
  return { templates: Array.isArray(partial?.templates) ? partial.templates : [] };
}

export function newTemplate(title: string, category: string): Template {
  return {
    id: crypto.randomUUID(),
    title,
    body: "",
    category,
    archived: false,
  };
}

export function activeTemplates(data: TemplatesData): Template[] {
  return data.templates.filter((t) => !t.archived).sort((a, b) => a.title.localeCompare(b.title));
}

export function addTemplate(data: TemplatesData, template: Template): TemplatesData {
  return { ...data, templates: [template, ...data.templates] };
}

export function updateTemplate(
  data: TemplatesData,
  id: string,
  updater: (t: Template) => Template
): TemplatesData {
  return { ...data, templates: data.templates.map((t) => (t.id === id ? updater(t) : t)) };
}

export function archiveTemplate(data: TemplatesData, id: string): TemplatesData {
  return updateTemplate(data, id, (t) => ({ ...t, archived: true }));
}
