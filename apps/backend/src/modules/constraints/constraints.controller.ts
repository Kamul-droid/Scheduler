import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConstraintsService } from './constraints.service';
import { CreateConstraintDto } from './dto/create-constraint.dto';
import { UpdateConstraintDto } from './dto/update-constraint.dto';

@Controller('constraints')
export class ConstraintsController {
  constructor(private readonly constraintsService: ConstraintsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createConstraintDto: CreateConstraintDto) {
    return this.constraintsService.create(createConstraintDto);
  }

  @Get()
  findAll() {
    return this.constraintsService.findAll();
  }

  @Get('active')
  getActiveConstraints() {
    return this.constraintsService.getActiveConstraints();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.constraintsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConstraintDto: UpdateConstraintDto,
  ) {
    return this.constraintsService.update(id, updateConstraintDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.constraintsService.remove(id);
  }
}

