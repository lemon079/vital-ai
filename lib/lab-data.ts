import { LabReference } from '@/types/labs';
import labDataRaw from './access-medicine-lab-reference-numbers.json';

// The data is loaded once when this module is first imported.
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
