
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

export const uploadFile = async (file: File, bucket: string = 'attachments'): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error: any) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
        return null;
    }
};
