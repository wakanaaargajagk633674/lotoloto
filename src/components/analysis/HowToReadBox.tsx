type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function HowToReadBox({ title = "この表の見方", children }: Props) {
  return (
    <div className="how-to-read">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
