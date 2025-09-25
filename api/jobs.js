export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      data: [
        { id: 1, title: "Frontend Engineer", status: "open" },
        { id: 2, title: "Backend Engineer", status: "closed" },
      ],
    });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
