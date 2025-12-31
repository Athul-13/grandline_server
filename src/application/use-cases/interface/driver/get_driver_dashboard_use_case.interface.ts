import { DriverDashboardRequestDto, DriverDashboardResponseDto } from '../../../dtos/driver_dashboard.dto';

export interface IGetDriverDashboardUseCase {
  execute(driverId: string, request: DriverDashboardRequestDto): Promise<DriverDashboardResponseDto>;
}


