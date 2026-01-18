export const metadata = {
    title: "Interested Users - Administration",
    description: "Manage and view interested users in the administration panel.",
};

export default function InterestedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}