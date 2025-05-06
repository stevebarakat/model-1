import styles from "./PowerButton.module.css";

function PowerButton() {
  return (
    <label className={styles.power}>
      <input type="checkbox" checked={true} />
      <div className={styles.button}>
        <div className={styles.light}></div>
        <div className={styles.dots}></div>
        <div className={styles.characters}></div>
        <div className={styles.shine}></div>
        <div className={styles.shadow}></div>
      </div>
    </label>
  );
}

export default PowerButton;
