const steps = [
  "ロトを選ぶ",
  "分析タイプを選ぶ",
  "参考買い目を見る"
];

export default function SimpleStepGuide() {
  return (
    <ol className="simple-step-guide" aria-label="かんたん3ステップ">
      {steps.map((step, index) => (
        <li key={step}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}
