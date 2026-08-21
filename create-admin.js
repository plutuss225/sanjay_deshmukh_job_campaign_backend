const supabase = require('./src/supabaseClient');

async function createAdminUser() {
  const email = 'admin@gmail.com';
  const password = 'Admin@123';

  console.log(`Creating Admin user in Supabase: ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('❌ Error creating Admin user:', error.message);
  } else {
    console.log('✅ Admin user created successfully in Supabase!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
  }
}

createAdminUser();
