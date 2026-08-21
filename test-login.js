const supabase = require('./src/supabaseClient');

async function loginAdminUser() {
  const email = 'admin@sanjaydeshmukh.com';
  const password = 'Admin@123';

  console.log(`Testing Login for Admin user: ${email}...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error('❌ Login Error:', error.message);
  } else {
    console.log('🎉 Login successful! Admin credentials are valid.');
    console.log('User ID:', data.user?.id);
    console.log('Access Token:', data.session?.access_token.substring(0, 30) + '...');
  }
}

loginAdminUser();
