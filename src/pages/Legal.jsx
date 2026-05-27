import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Legal() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
                <Link to="/">
                    <Logo size={36} />
                </Link>
                <Link to="/login">
                    <button className="bg-white text-black px-5 py-2.5 rounded-2xl font-semibold text-sm hover:scale-105 transition">
                        Start Selling
                    </button>
                </Link>
            </nav>

            <div className="max-w-3xl mx-auto px-6 md:px-12 py-16">
                {/* Tabs */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl w-fit mb-12">
                    <a href="#terms">
                        <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-black transition">
                            Terms of Service
                        </button>
                    </a>
                    <a href="#privacy">
                        <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition">
                            Privacy Policy
                        </button>
                    </a>
                </div>

                {/* Terms of Service */}
                <section id="terms" className="mb-20">
                    <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                    <p className="text-gray-500 text-sm mb-10">Last updated: May 2025</p>

                    {[
                        {
                            title: "1. Acceptance of Terms",
                            body: `By accessing or using Shophala ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all users including vendors and customers.`,
                        },
                        {
                            title: "2. Description of Service",
                            body: `Shophala provides a WhatsApp-powered storefront platform for African businesses. Vendors can create online stores, manage products, and receive orders through WhatsApp. Shophala is a technology platform and is not responsible for the products or services sold by vendors.`,
                        },
                        {
                            title: "3. Vendor Responsibilities",
                            body: `As a vendor, you are solely responsible for:\n• The accuracy of your product listings\n• Delivering products or services to your customers\n• Handling customer disputes and refunds\n• Complying with all applicable Nigerian laws\n• Maintaining accurate pricing and inventory`,
                        },
                        {
                            title: "4. Prohibited Activities",
                            body: `You may not use Shophala to:\n• Sell illegal, counterfeit, or prohibited goods\n• Defraud customers or collect payment without intent to deliver\n• Impersonate other vendors or businesses\n• Spam or harass customers\n• Violate any applicable laws or regulations`,
                        },
                        {
                            title: "5. Payment & Subscriptions",
                            body: `Shophala offers free and paid subscription plans. Paid plans are billed monthly or yearly via Flutterwave. All payments are in Nigerian Naira (NGN). Subscriptions auto-renew unless cancelled. Refunds are reviewed on a case-by-case basis within 7 business days of request.`,
                        },
                        {
                            title: "6. Limitation of Liability",
                            body: `Shophala is not liable for:\n• Transactions between vendors and customers\n• Loss of data, revenue, or business\n• Downtime or technical issues\n• Actions taken by third-party services (WhatsApp, Flutterwave, Firebase)\n\nOur maximum liability to you shall not exceed the amount you paid us in the last 3 months.`,
                        },
                        {
                            title: "7. Termination",
                            body: `We reserve the right to suspend or terminate your account at any time if you violate these terms. You may cancel your account at any time by contacting us on WhatsApp.`,
                        },
                        {
                            title: "8. Changes to Terms",
                            body: `We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.`,
                        },
                        {
                            title: "9. Governing Law",
                            body: `These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved under Nigerian law.`,
                        },
                        {
                            title: "10. Contact",
                            body: `For questions about these terms, contact us via WhatsApp or email at support@shophala.com`,
                        },
                    ].map((section) => (
                        <div key={section.title} className="mb-8">
                            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                            <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                                {section.body}
                            </p>
                        </div>
                    ))}
                </section>

                {/* Divider */}
                <div className="border-t border-white/10 mb-20" />

                {/* Privacy Policy */}
                <section id="privacy">
                    <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 text-sm mb-10">Last updated: May 2025</p>

                    {[
                        {
                            title: "1. Information We Collect",
                            body: `When you use Shophala, we collect:\n• Name and email address (on signup)\n• WhatsApp phone number\n• Product and store information you provide\n• Payment transaction references (not card details)\n• Usage data and analytics`,
                        },
                        {
                            title: "2. How We Use Your Information",
                            body: `We use your information to:\n• Create and manage your vendor account\n• Process subscription payments\n• Send important account notifications\n• Improve the Platform\n• Provide customer support\n\nWe do NOT sell your personal data to third parties.`,
                        },
                        {
                            title: "3. Data Storage",
                            body: `Your data is stored securely using Google Firebase, which complies with industry-standard security practices. Data is stored on Google's servers and may be processed outside Nigeria.`,
                        },
                        {
                            title: "4. Payment Data",
                            body: `We do not store your card details. All payments are processed by Flutterwave, a PCI-DSS compliant payment processor. We only store transaction references and amounts for record-keeping.`,
                        },
                        {
                            title: "5. WhatsApp Integration",
                            body: `When customers checkout via WhatsApp, their order details are shared directly with your WhatsApp number. We do not store customer WhatsApp messages. WhatsApp's own privacy policy applies to all messages sent through their platform.`,
                        },
                        {
                            title: "6. Cookies",
                            body: `Shophala uses minimal cookies for authentication and session management. We do not use advertising or tracking cookies.`,
                        },
                        {
                            title: "7. Your Rights",
                            body: `You have the right to:\n• Access your personal data\n• Request deletion of your account and data\n• Update your information at any time\n• Opt out of non-essential communications\n\nTo exercise these rights, contact us on WhatsApp.`,
                        },
                        {
                            title: "8. Data Retention",
                            body: `We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where required by law.`,
                        },
                        {
                            title: "9. Children's Privacy",
                            body: `Shophala is not intended for users under 18 years of age. We do not knowingly collect data from minors.`,
                        },
                        {
                            title: "10. Contact",
                            body: `For privacy concerns, contact us via WhatsApp or email at privacy@shophala.com`,
                        },
                    ].map((section) => (
                        <div key={section.title} className="mb-8">
                            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                            <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                                {section.body}
                            </p>
                        </div>
                    ))}
                </section>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 md:px-12 py-8 text-center text-gray-500 text-sm">
                © 2025 Shophala. Built for African businesses.
                <div className="flex items-center justify-center gap-6 mt-3">
                    <Link to="/legal" className="hover:text-white transition">Terms & Privacy</Link>
                    <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
                    <Link to="/login" className="hover:text-white transition">Login</Link>
                </div>
            </footer>
        </div>
    );
}