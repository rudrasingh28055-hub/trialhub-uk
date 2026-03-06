import Link from "next/link";

export default function OpportunityCard({ item }: any) {
  return (
    <div className="border p-6 rounded-lg bg-white text-black">
      <h2 className="text-xl font-bold">{item.title}</h2>

      <p>{item.location_city}</p>

      <p>{item.description}</p>

      <Link
        href={`/opportunity/${item.id}`}
        className="text-blue-600 mt-4 block"
      >
        View Details
      </Link>
    </div>
  );
}