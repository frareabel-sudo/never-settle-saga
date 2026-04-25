"use client";

import { useEffect, useState } from "react";
import { Mail, MapPin, Clock, Globe, MessageCircle, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/motion-wrapper";
import { DEFAULT_CONTACT_SETTINGS, type ContactSettings } from "@/lib/store-settings";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    fetch("/api/settings/contact")
      .then((r) => r.json())
      .then((d) => d.success && d.contact && setContact(d.contact))
      .catch(() => {});
  }, []);

  const socials = [
    { Icon: Globe, label: "Instagram", href: contact.social.instagram },
    { Icon: MessageCircle, label: "Facebook", href: contact.social.facebook },
    { Icon: Share2, label: "Twitter", href: contact.social.twitter },
  ].filter((s) => s.href && s.href.trim().length > 0);

  return (
    <>
      {/* Header */}
      <section className="pt-24 lg:pt-28 pb-8 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Have a question, custom request, or just want to say hello?
              We&apos;d love to hear from you.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <FadeIn direction="left">
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-6">
                    Contact <span className="text-gradient">Info</span>
                  </h2>

                  <div className="space-y-5">
                    {[
                      {
                        icon: Mail,
                        title: "Email",
                        text: contact.email,
                        sub: "We reply within 24 hours",
                      },
                      {
                        icon: MapPin,
                        title: "Location",
                        text: contact.address,
                      },
                      {
                        icon: Clock,
                        title: "Hours",
                        text: contact.hours,
                        sub: "Weekend orders processed Monday",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-amber-400/80 text-sm">{item.text}</p>
                          {item.sub && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Socials */}
                {socials.length > 0 && (
                  <div>
                    <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-amber-400/80 mb-4">
                      Follow Us
                    </h3>
                    <div className="flex gap-3">
                      {socials.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="w-10 h-10 rounded-full border border-charcoal-50 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
                        >
                          <s.Icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ nudge */}
                <div className="p-4 rounded-lg bg-charcoal-400/30 border border-charcoal-50/20">
                  <h3 className="font-semibold text-sm mb-2">Common questions?</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Check our FAQ for answers about shipping times, customisation
                    options, returns, and more.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Contact Form */}
            <FadeIn direction="right" className="lg:col-span-2">
              <div className="bg-charcoal-400/20 rounded-lg border border-charcoal-50/20 p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-gray-400">
                      Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl font-bold mb-6">
                      Send a <span className="text-gradient">Message</span>
                    </h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSubmitted(true);
                      }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">
                            Name
                          </label>
                          <Input placeholder="Your name" required />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">
                            Email
                          </label>
                          <Input type="email" placeholder="your@email.com" required />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                          Subject
                        </label>
                        <select className="w-full h-10 px-3 rounded border border-charcoal-50 bg-charcoal-200 text-sm text-foreground focus:border-amber-500/50 focus:outline-none">
                          <option>General Enquiry</option>
                          <option>Custom Order</option>
                          <option>Shipping Question</option>
                          <option>Returns / Refund</option>
                          <option>Collaboration / Press</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                          Message
                        </label>
                        <Textarea
                          placeholder="Tell us what you need..."
                          rows={6}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full sm:w-auto gap-2">
                        <Send className="w-4 h-4" /> Send Message
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
