const supabaseUrl = "https://jnxfyllfxvqdoyxwhlmg.supabase.co";
const serviceRoleKey = "sb_secret_XLJzv8Cgem6ddD0EEIvrQw_VgjgB1B4";

async function run() {
  console.log("Creating a dummy user to test deletion...");
  
  // 1. Create User
  const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: `test_delete_${Date.now()}@example.com`,
      password: "password123",
      email_confirm: true
    })
  });
  
  const createdUser = await createUserRes.json();
  if (!createUserRes.ok) {
    console.error("Failed to create dummy user:", createdUser);
    return;
  }
  
  const userId = createdUser.id;
  console.log("Created dummy user:", userId);
  
  // 2. Attempt to delete User
  console.log("Attempting to delete user...");
  const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`
    }
  });
  
  if (!deleteRes.ok) {
    const err = await deleteRes.json();
    console.error("Deletion failed with error:", err);
  } else {
    console.log("Deletion succeeded!");
  }
}

run();
