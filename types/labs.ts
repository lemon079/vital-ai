
export type Gender = "male" | "female" | "any";

export type LabReference = {
    test_name: string;
    specimen: string;
    gender: string;
    normal_low: number | null;
    normal_high: number | null;
    unit: string;
};


export interface LabInput {
    test_name: string;
    specimen: string;
    gender: Gender;
    value: number;
    unit: string;
}

export type LabFlag =
    | "NORMAL"
    | "LOW"
    | "HIGH"
    | "CRITICAL"
    | "CRITICAL_HIGH"
    | "CRITICAL_LOW"
    | "UNDETERMINED";

export interface LabEvaluation {
    test_name: string;
    value: number;
    unit: string;
    flag: LabFlag;
    reference_range?: string;
    specimen: string;
}

export interface LabResultData {
    test_name: string;
    value: number;
    unit: string;
    flag: LabFlag;
    specimen?: string;
    reference_low?: number | null;
    reference_high?: number | null;
    reference_unit?: string;
    gender?: 'male' | 'female' | 'any';
}
