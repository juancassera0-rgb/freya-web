import Image from "next/image";
import styles from "./ProjectVisual.module.css";

type Props = {
  src: string;
  alt: string;
  large?: boolean;
  priority?: boolean;
};

export function ProjectVisual({
  src,
  alt,
  large = false,
  priority = false,
}: Props) {
  return (
    <div className={styles.visual} data-large={large}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={large ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 800px) 100vw, 50vw"}
        className={styles.image}
        priority={priority}
      />
      <div className={styles.shade} />
    </div>
  );
}
