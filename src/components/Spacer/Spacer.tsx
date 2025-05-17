import styles from "./Spacer.module.css";

function Spacer() {
  return (
    <>
      <div className={styles.spacer}>
        <div className={styles.screwTopLeft} />
        <div className={styles.screwTopRight} />
        <div className={styles.screwBottomLeft} />
        <div className={styles.screwBottomRight} />
      </div>
    </>
  );
}

export default Spacer;
