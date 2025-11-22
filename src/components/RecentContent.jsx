// components/RecentContent.jsx
export default function RecentContent() {
  const recentArticles = [
    {
      id: 1,
      title: "The Evolution of Modern Engineering",
      excerpt: "How engineering principles shaped contemporary infrastructure...",
      image: "/eng-evolution.jpg",
      date: "2025-10-10",
      category: "Engineering"
    },
    {
      id: 2, 
      title: "Historical Patterns in Technological Advancement",
      excerpt: "Examining cyclical patterns in tech innovation through history...",
      image: "/tech-history.jpg",
      date: "2025-10-08",
      category: "Technology"
    }
  ];

  return (
    <section className="max-w-6xl mx-auto my-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Recent Research & Articles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recentArticles.map((article) => (
          <article key={article.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-48 object-cover rounded-t-xl"
            />
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-blue-600">{article.category}</span>
                <span className="text-sm text-gray-500">{article.date}</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">{article.title}</h3>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                Read Full Analysis →
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}