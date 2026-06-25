import React from "react";
import styles from "./SpecRow.module.css";

export const SpecRow = ({ label, value, icon, func }) => (
  <div className={styles.row}>
    <div className={styles.label}>{label}:</div>
    <span onClick={func ? () => func() : undefined} className={styles.value}>
      {value} {icon}{" "}
    </span>
  </div>
);
