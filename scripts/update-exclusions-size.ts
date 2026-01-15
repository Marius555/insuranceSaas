// Temporary script to update exclusions field size from 200 to 500
import { config } from 'dotenv';
config();

import { adminAction } from '../appwrite/adminOrClient';

async function updateExclusionsSize() {
  try {
    const { databases } = await adminAction();
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const collectionId = 'claim_assessments';
    const attributeKey = 'exclusions';

    console.log('📝 Updating exclusions field size from 200 to 500...');

    // Note: Appwrite doesn't support direct attribute size updates
    // We need to delete and recreate the attribute
    // However, this will lose data, so we'll just document this

    console.log('⚠️  Manual action required:');
    console.log('   1. Go to Appwrite Console');
    console.log('   2. Navigate to Database → insurance → claim_assessments');
    console.log('   3. Find the "exclusions" attribute');
    console.log('   4. Edit the attribute and change size from 200 to 500');
    console.log('   5. Save the changes');
    console.log('');
    console.log('   OR if no data exists yet, you can delete and recreate:');
    console.log('   - Delete the exclusions attribute');
    console.log('   - Create a new one with size 500');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateExclusionsSize();
