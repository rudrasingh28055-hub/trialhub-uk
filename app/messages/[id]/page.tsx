import Navbar from "@/components/Navbar"
import PageHeader from "@/components/layout/PageHeader"
import { createClient } from "../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) {
    notFound();
  }

  async function sendMessage(formData: FormData) {
    "use server";

    const content = String(formData.get("content") || "").trim();

    if (!content) return;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      content,
    });

    revalidatePath(`/messages/${id}`);
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <PageHeader
          eyebrow="Conversation"
          title="Direct messages"
          subtitle="One-to-one thread between club and athlete."
        />

        {messagesError ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading messages: {messagesError.message}
          </div>
        ) : null}

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {!messages || messages.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No messages yet. Start the conversation below.
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        isOwn
                          ? "bg-blue-500 text-white"
                          : "border border-white/10 bg-white/5 text-slate-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form action={sendMessage} className="flex gap-3">
          <input
            name="content"
            placeholder="Type a message..."
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <button
            type="submit"
            className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}