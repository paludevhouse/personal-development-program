export interface TemplateVars {
  pic?: string;
  siswa?: string;
  perusahaan?: string;
  link?: string;
}

export function fillTemplate(template: string, vars: TemplateVars): string {
  const map: Record<string, string> = {
    pic: vars.pic ?? "",
    siswa: vars.siswa ?? "",
    perusahaan: vars.perusahaan ?? "",
    link: vars.link ?? "",
  };
  return (template ?? "").replace(/\{(pic|siswa|perusahaan|link)\}/g, (_, k) => map[k]);
}
