import FridgeScanner from "@/components/FridgeScanner";
import ListingForm from "@/components/ListingForm";

export default function NewListingPage() {
  return (
    <main>
      <h1>Share something</h1>
      <FridgeScanner />
      <hr />
      <ListingForm />
    </main>
  );
}
