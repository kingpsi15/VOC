
import { supabase } from '@/integrations/supabase/client';

// Export the supabase client directly from the integration
export { supabase };

// Remove demo mode - we're now fully connected to the database
export const isDemoMode = false;
