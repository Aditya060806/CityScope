import { supabase } from '@/lib/supabase';

export class DatabaseTestService {
  static async testDatabaseConnection(): Promise<{
    success: boolean;
    error?: string;
    tables?: string[];
  }> {
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      // Test if security_policies table exists
      const { data: policies, error: policiesError } = await supabase
        .from('security_policies')
        .select('count')
        .limit(1);

      if (policiesError) {
        console.warn('security_policies table error:', policiesError);
      }

      // Test if rewards table exists
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('count')
        .limit(1);

      if (rewardsError) {
        console.warn('rewards table error:', rewardsError);
      }

      return { 
        success: true, 
        tables: [
          'users',
          policiesError ? 'security_policies (error)' : 'security_policies (ok)',
          rewardsError ? 'rewards (error)' : 'rewards (ok)'
        ]
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async testTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}
