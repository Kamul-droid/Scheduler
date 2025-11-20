import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { SchedulesService } from './schedules.service';

@Resolver(() => Schedule)
export class ScheduleResolver {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Query(() => [Schedule], { name: 'schedules' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Query(() => Schedule, { name: 'schedule', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.schedulesService.findOne(id);
  }

  @Mutation(() => Schedule)
  createSchedule(
    @Args('createScheduleInput') createScheduleInput: CreateScheduleDto,
  ) {
    return this.schedulesService.create(createScheduleInput);
  }

  @Mutation(() => Schedule)
  updateSchedule(
    @Args('updateScheduleInput') updateScheduleInput: UpdateScheduleDto & { id: string },
  ) {
    return this.schedulesService.update(
      updateScheduleInput.id,
      updateScheduleInput,
    );
  }

  @Mutation(() => Schedule, { nullable: true })
  removeSchedule(@Args('id', { type: () => ID }) id: string) {
    return this.schedulesService.remove(id);
  }
}

