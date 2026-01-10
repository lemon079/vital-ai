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
    | "UNDETERMINED";

export interface LabEvaluation {
    test_name: string;
    value: number;
    unit: string;
    flag: LabFlag;
    reference_range?: string;
    specimen: string;
}
