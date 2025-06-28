import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PersonalInfoTexts } from '@/constants/localize';
import {
  Calendar,
  CircuitBoard,
  Download,
  FileText,
  FileUp,
  MapPin,
  Phone,
  Trash2,
} from 'lucide-react';

// TODO: Receive user data as props and display resume information
export function PersonalInfo() {
  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex justify-between">
        <span className="text-xl font-bold">{PersonalInfoTexts.title}</span>
        <section className="flex gap-4">
          <Button className="w-40">
            <CircuitBoard />
            <span>{PersonalInfoTexts.generateContract}</span>
          </Button>
          <Button className="w-40">
            <FileUp />
            <span>{PersonalInfoTexts.uploadContract}</span>
          </Button>
        </section>
      </div>
      <section className="flex p-4 justify-between items-center rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#DBEAFE] text-[#2563EB]">
            <span className="w-10 h-10">
              <FileText className='w-full h-full'/>
            </span>
          </div>
          <span className="flex flex-col">
            <span className="text-lg font-semibold">
              {PersonalInfoTexts.resume}
            </span>
            <span>{`${PersonalInfoTexts.lastUpdated}: 28/09/2023`}</span>
          </span>
        </div>
        <section className="flex flex-col items-center gap-2">
          <Button variant="outline" className="w-48">
            <Download />
            <span>{PersonalInfoTexts.download}</span>
          </Button>
          <Button variant="outline" className="w-48">
            <FileUp />
            <span>{PersonalInfoTexts.upload}</span>
          </Button>
        </section>
      </section>
      <section className="flex justify-end">
        <Button variant="destructive" className="w-48">
          <Trash2 />
          <span>{PersonalInfoTexts.delete}</span>
        </Button>
      </section>
      <section className="flex gap-8">
        <section className="flex flex-col gap-4 w-full">
          <span className="text-lg font-semibold">
            {PersonalInfoTexts.details}
          </span>
          <Separator decorative className="p-[1px]" />
          <section className="flex gap-4 items-center">
            <MapPin className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">
                {PersonalInfoTexts.address}
              </span>
              <span className="font-light">
                123 Main St, Springfield, IL 62701
              </span>
            </p>
          </section>
          <section className="flex gap-4 items-center">
            <Calendar className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">
                {PersonalInfoTexts.birthDate}
              </span>
              <span className="font-light">04/07/2001 (24)</span>
            </p>
          </section>
        </section>
        <section className="flex flex-col gap-4 w-full">
          <span className="text-lg font-semibold">
            {PersonalInfoTexts.details}
          </span>
          <Separator decorative className="p-[1px]" />
          <section className="flex gap-4 items-center">
            <Phone className="text-gray-400" />
            <p className="flex flex-col">
              <span className="text-md font-medium">Jacob Covington</span>
              <span className="font-light">+1 (555) 123-4567</span>
            </p>
          </section>
        </section>
      </section>
    </section>
  );
}
