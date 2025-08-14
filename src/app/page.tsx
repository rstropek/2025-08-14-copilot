import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.main}>
      <h1>Customer Management System</h1>
      <p>Welcome to the customer management system. Choose an option below:</p>
      
      <div className={styles.grid}>
        <Link href="/create-customer" className={styles.card}>
          <h2>Create Customer</h2>
          <p>Add a new customer to the system</p>
        </Link>

        <Link href="/browse/customers" className={styles.card}>
          <h2>Browse Customers (Server)</h2>
          <p>View all customers using server-side rendering</p>
        </Link>

        <Link href="/browse-client/customers" className={styles.card}>
          <h2>Browse Customers (Client)</h2>
          <p>View all customers using client-side rendering</p>
        </Link>
      </div>
    </div>
  );
}
