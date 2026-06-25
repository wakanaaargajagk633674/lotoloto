import type { ExpertView } from "@/loto/expertViews";

export default function ExpertViewCard({ view }: { view: ExpertView }) {
  return (
    <article className="expert-card">
      <h2>{view.name}の視点</h2>
      <dl>
        <div>
          <dt>見るべきポイント</dt>
          <dd>{view.lookAt}</dd>
        </div>
        <div>
          <dt>過信しないポイント</dt>
          <dd>{view.caution}</dd>
        </div>
        <div>
          <dt>ちょっと違う見方</dt>
          <dd>{view.alternative}</dd>
        </div>
        <div>
          <dt>このサイトで確認できる場所</dt>
          <dd>{view.siteContent}</dd>
        </div>
      </dl>
    </article>
  );
}
