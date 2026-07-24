"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import ScrollReveal from "@/components/ScrollReveal";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
      ]);

      if (error) throw error;

      addToast("Success", "success", "Message sent successfully.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      addToast("Error", "error", error.message || "Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-zinc-950 border-t border-white/5 scroll-mt-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12" direction="up">
          <h2 className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-4">
            Get in Touch
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact Us
          </p>
        </ScrollReveal>

        <ScrollReveal className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm" direction="up" delayMs={150}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-zinc-900 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-zinc-900 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-zinc-900 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors text-sm"
                placeholder="How can we help?"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full p-4 bg-zinc-900 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-colors text-sm resize-none"
                placeholder="Write your message here..."
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-lime-400 hover:bg-lime-300 text-black font-extrabold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  Send Message
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}
