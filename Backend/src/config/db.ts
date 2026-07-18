import { supabase } from './supabase';

export const connectDB = async (): Promise<void> => {
  try {
    const { error } = await supabase.from('categories').select('id').limit(1);
    if (error) throw error;

    console.log('Supabase connected successfully');
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    process.exit(1);
  }
};
