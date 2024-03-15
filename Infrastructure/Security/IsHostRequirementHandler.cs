
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Persistence;

public class IsHostRequirement : IAuthorizationRequirement
{

}

public class IsHostRequirementHandler : AuthorizationHandler<IsHostRequirement>
{
    private readonly DataContext _dataContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public IsHostRequirementHandler(DataContext dataContext, IHttpContextAccessor httpContextAccessor)
    {
        _dataContext = dataContext;
        _httpContextAccessor = httpContextAccessor;
    }


    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, IsHostRequirement requirement)
    {
        var UserId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (UserId == null) return Task.CompletedTask;

        var activityId = Guid.Parse(_httpContextAccessor.HttpContext?.Request.RouteValues
        .SingleOrDefault(x => x.Key == "id").Value?.ToString());

        var attendee = _dataContext.ActivityAttendee
        .AsNoTracking()
        .SingleOrDefaultAsync(x => x.AppUserId == UserId && x.ActivityId == activityId)
        .Result;

        if (attendee == null) return Task.CompletedTask;

        if (attendee.IsHost) context.Succeed(requirement);

        return Task.CompletedTask;
    }
}