type Props = {
  label: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export default function PageHero({ label, title, description, actions }: Props) {
  return (
    <section className="page-hero">
      <p className="section-label">{label}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {actions ? <div className="page-hero-actions">{actions}</div> : null}
    </section>
  );
}
