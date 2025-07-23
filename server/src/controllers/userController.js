export const adminLogin = (req, res) => {
  res.json({ message: "Welcome Admin" });
};

export const managerLogin = (req, res) => {
  res.json({ message: "Welcome Manager" });
};

export const userLogin = (req, res) => {
  res.json({ message: "Welcome User" });
};

export const publicInfo = (req,res) => {
  res.json({message: "Welcome UNKNOWN"})
}