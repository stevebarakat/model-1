import styles from "../styles/example.module.css";

interface CardProps {
  title: string;
  content: string;
}

export function Card({ title, content }: CardProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.content}>{content}</p>
      <button className={styles.button}>Click me</button>
    </div>
  );
}
