import { LabReference } from '@/types/labs';
import labDataRaw from '../access-medicine-lab-reference-numbers.json'; // Make sure this JSON is also moved or referenced correctly. Wait, it's relative.

// The JSON file should also be moved to lib/services/ or the import path adjusted.
// For now, I'll assume the JSON is still in lib/ (root) or needs to be provided.
// Previous location: lib/access-medicine-lab-reference-numbers.json
// New location: lib/services/lab-data.ts
// So import should be '../access-medicine-lab-reference-numbers.json' if JSON stays in lib/
// I will keep JSON in lib/ for now or move it too? 
// The plan didn't specify moving the JSON. I'll use '../access-medicine-lab-reference-numbers.json'.

console.log('----------------------------------------------------');
console.log('Loading reference lab data from JSON into memory...');
console.log('----------------------------------------------------');
const labData: LabReference[] = labDataRaw as LabReference[];

export function getLabData(): LabReference[] {
    return labData;
}

export function findLabTest(name: string): LabReference | undefined {
    return labData.find((test) => test.test_name.toLowerCase() === name.toLowerCase());
}
