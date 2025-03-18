db = db.getSiblingDB("TextBee");

db.createUser({
  user: "textbeeUser",
  pwd: "textbeePassword",
  roles: [{ role: "readWrite", db: "TextBee" }]
});

db.init.insertOne({ createdBy: "seed" });

print("✅ TextBee DB initialized and user created.");
