using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ProfilesController : BaseApiController
    {
        [HttpGet("{username}")]
        public async Task<IActionResult> Delete(string username)
        {
            return HandleResult(await Mediator.Send(new Application.Photos.Details.Query { Username = username }));
        }
    }

}