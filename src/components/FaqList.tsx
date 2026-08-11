import { faqs } from "@/data/faq";
import styles from "./FaqList.module.css";

type Props = {
  limit?: number;
};

export function FaqList({ limit }: Props) {
  const items = typeof limit === "number" ? faqs.slice(0, limit) : faqs;

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.q} className={styles.item}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
