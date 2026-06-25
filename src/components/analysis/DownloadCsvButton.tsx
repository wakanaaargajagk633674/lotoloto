import Link from "next/link";

type Props = {
  href: string;
  children?: React.ReactNode;
};

export default function DownloadCsvButton({ href, children = "CSVをダウンロード" }: Props) {
  return (
    <Link className="download-button" href={href}>
      {children}
    </Link>
  );
}
