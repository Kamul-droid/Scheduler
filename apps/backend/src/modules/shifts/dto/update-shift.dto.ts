import { InputType, PartialType } from '@nestjs/graphql';
import { CreateShiftDto } from './create-shift.dto';

@InputType()
export class UpdateShiftDto extends PartialType(CreateShiftDto) {}

