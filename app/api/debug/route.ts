import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";

export async function GET() {
  try {
    const permDoc = await getDoc(doc(db, "users", "permissions_matrix"));
    const permData = permDoc.exists() ? permDoc.data() : null;

    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ permissions: permData, users: usersData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
